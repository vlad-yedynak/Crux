using Crux.Data;
using Crux.Models;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class ApplicationAuthService(
    ApplicationDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    IDistributedCache distributedCache) : IApplicationAuthService
{
    public AuthResponse SignUp(UserSignUpRequest request)
    {
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            ScorePoints = 0
        };

        if (dbContext.Users.Any(u => u.Email == user.Email))
            return new AuthResponse
            {
                Success = false,
                Error = "User with this email already exists!"
            };

        user.Password = HashPassword(user, request.Password);

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        return SignIn(request);
    }

    public AuthResponse SignIn(UserSignInRequest request)
    {
        var user = dbContext.Users.FirstOrDefault(u => u.Email == request.Email);

        if (user == null || !VerifyPassword(user, user.Password, request.Password))
            return new AuthResponse
            {
                Success = false,
                Error = "Wrong credentials"
            };

        var token = Guid.NewGuid().ToByteArray();
        distributedCache.Set(user.Id.ToString(), token);

        return new AuthResponse
        {
            Success = true,
            UserId = user.Id.ToString(),
            Token = Convert.ToBase64String(token)
        };
    }

    public AuthResponse SignOut(HttpContext httpContext)
    {
        if (!httpContext.Request.Headers.TryGetValue("Authorization", out var authHeader))
            return new AuthResponse
            {
                Success = false,
                Error = "No authorization header provided"
            };

        var authHeaderValue = authHeader.ToString();
        if (!authHeaderValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return new AuthResponse
            {
                Success = false,
                Error = "Invalid authorization format"
            };

        var token = authHeaderValue.Substring("Bearer ".Length).Trim();

        var userId = GetUserIdFromToken(token);

        if (string.IsNullOrEmpty(userId))
            return new AuthResponse
            {
                Success = false,
                Error = "Invalid token"
            };

        distributedCache.Remove(userId);

        return new AuthResponse
        {
            Success = true
        };
    }

    public bool CheckAuthentication(HttpContext httpContext)
    {
        if (!httpContext.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        var authHeaderValue = authHeader.ToString();

        if (!authHeaderValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        var clientToken = authHeaderValue.Substring("Bearer ".Length).Trim();

        var userId = GetUserIdFromToken(clientToken);

        if (string.IsNullOrEmpty(userId))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status200OK;
        return true;
    }

    public string GetUserIdFromToken(string token)
    {
        foreach (var user in dbContext.Users)
        {
            var storedToken = distributedCache.Get(user.Id.ToString());
            if (storedToken != null && Convert.ToBase64String(storedToken) == token) return user.Id.ToString();
        }

        return string.Empty;
    }

    private string HashPassword(User user, string password)
    {
        return passwordHasher.HashPassword(user, password);
    }

    private bool VerifyPassword(User user, string hashedPassword, string givenPassword)
    {
        return passwordHasher.VerifyHashedPassword(user, hashedPassword, givenPassword) ==
               PasswordVerificationResult.Success;
    }
}
