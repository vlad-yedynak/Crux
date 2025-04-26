using Crux.Data;
using Crux.Models;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class AuthenticationService(
    ApplicationDbContext dbContext,
    IPasswordHasher<User> passwordHasher,
    IDistributedCache distributedCache) : IAuthenticationService
{
    public AuthenticationResponse SignUp(UserRequest request)
    {
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            ScorePoints = 0,
            Role = UserRole.User
        };

        if (dbContext.Users.Any(u => u.Email == user.Email))
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "User with this email already exists!"
            };
        }
        
        user.Password = HashPassword(user, request.Password);

        dbContext.Users.Add(user);
        dbContext.SaveChanges();

        return SignIn(request);
    }

    public AuthenticationResponse SignIn(UserRequest request)
    {
        var user = dbContext.Users.FirstOrDefault(u => u.Email == request.Email);

        if (user == null || !VerifyPassword(user, user.Password, request.Password))
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Wrong credentials"
            };
        }

        var token = Guid.NewGuid().ToByteArray();
        distributedCache.Set(user.Id.ToString(), token);

        return new AuthenticationResponse
        {
            Success = true,
            UserId = user.Id.ToString(),
            Token = Convert.ToBase64String(token)
        };
    }

    public AuthenticationResponse SignOut(HttpContext context)
    {
        
        var userId = GetUserIdFromToken(context);

        if (userId == null)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Invalid token"
            };
        }

        distributedCache.Remove(userId.Value.ToString());

        return new AuthenticationResponse
        {
            Success = true
        };
    }

    public bool CheckAuthentication(HttpContext context, UserRole? role = null)
    {

        var userId = GetUserIdFromToken(context);

        if (userId == null)
        {
            return false;
        }

        if (role.HasValue)
        {
            var user = dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return false;
            }
            
            return user.Role == role;
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
