using Crux.Data;
using Crux.Models;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Identity;
using Crux.Models.Requests;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class ApplicationAuthService : IApplicationAuthService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IDistributedCache _distributedCache;
    
    public ApplicationAuthService(ApplicationDbContext dbContext, IPasswordHasher<User> passwordHasher, IDistributedCache distributedCache)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _distributedCache = distributedCache;
    }

    public AuthResponse SignUp(UserSignUpRequest request)
    {
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password
        };

        if (_dbContext.Users.Any(u => u.Email == user.Email))
        {
            return new AuthResponse
            {
                Success = false,
                Error = "User with this email already exists!"
            };
        }
        
        user.Password = HashPassword(user, request.Password);
        
        _dbContext.Users.Add(user);
        _dbContext.SaveChanges();
        
        return SignIn(request);
    }
    
    public AuthResponse SignIn(UserSignInRequest request)
    {
        var user = _dbContext.Users.FirstOrDefault(u => u.Email == request.Email);
            
        if (user == null || !VerifyPassword(user, user.Password, request.Password))
        {
            return new AuthResponse
            {
                Success = false,
                Error = "Wrong credentials"
            };
        }

        var token = Guid.NewGuid().ToByteArray();
        _distributedCache.Set(user.Id.ToString(), token);

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
        {
            return new AuthResponse
            {
                Success = false,
                Error = "No authorization header provided"
            };
        }

        string authHeaderValue = authHeader.ToString();
        if (!authHeaderValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return new AuthResponse
            {
                Success = false,
                Error = "Invalid authorization format"
            };
        }

        string token = authHeaderValue.Substring("Bearer ".Length).Trim();

        string userId = GetUserIdFromToken(token);
        
        if (string.IsNullOrEmpty(userId))
        {
            return new AuthResponse
            {
                Success = false,
                Error = "Invalid token"
            };
        }
        
        _distributedCache.Remove(userId);

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

        string authHeaderValue = authHeader.ToString();

        if (!authHeaderValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        string clientToken = authHeaderValue.Substring("Bearer ".Length).Trim();

        var userId = GetUserIdFromToken(clientToken);
        
        if (string.IsNullOrEmpty(userId))
        {
            httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return false;
        }

        httpContext.Response.StatusCode = StatusCodes.Status200OK;
        return true;
    }

    private string GetUserIdFromToken(string token)
    {
        foreach (var user in _dbContext.Users)
        {
            var storedToken = _distributedCache.Get(user.Id.ToString());
            if (storedToken != null && Convert.ToBase64String(storedToken) == token)
            {
                return user.Id.ToString();
            }
        }
        return string.Empty;
    }

    private string HashPassword(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    private bool VerifyPassword(User user, string hashedPassword, string givenPassword)
    {
        return _passwordHasher.VerifyHashedPassword(user, hashedPassword, givenPassword) == PasswordVerificationResult.Success;
    }
}
