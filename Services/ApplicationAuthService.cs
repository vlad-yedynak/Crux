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

    public AuthResponse SignOut(HttpContext context)
    {
        
        var userId = GetUserIdFromToken(context);

        if (userId == null)
            return new AuthResponse
            {
                Success = false,
                Error = "Invalid token"
            };

        distributedCache.Remove(userId.Value.ToString());

        return new AuthResponse
        {
            Success = true
        };
    }

    public bool CheckAuthentication(HttpContext context)
    {

        var userId = GetUserIdFromToken(context);

        if (userId == null)
        {
            return false;
        }

        context.Response.StatusCode = StatusCodes.Status200OK;
        return true;
    }

    public int? GetUserIdFromToken(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return null;
        }

        var authHeaderValue = authHeader.ToString();

        if (!authHeaderValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return null;
        }

        var clientToken = authHeaderValue.Substring("Bearer ".Length).Trim();
        
        foreach (var userId in dbContext.Users.Select(u => u.Id))
        {
            var storedToken = distributedCache.Get(userId.ToString());
            if (storedToken != null && Convert.ToBase64String(storedToken) == clientToken) 
                return userId;
        }

        return null;
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
