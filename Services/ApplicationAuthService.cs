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

    public AuthResponse SignOut()
    {
        // TODO: Remove token for user with id and log them out
        throw new NotImplementedException();
    }

    public AuthResponse CheckAuthentication()
    {
        // TODO: Get token from header and check with token in session
        throw new NotImplementedException();
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
