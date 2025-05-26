using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class AuthenticationService(
    ApplicationDbContext dbContext,
    S3StorageService s3StorageService,
    IPasswordHasher<User> passwordHasher,
    IDistributedCache distributedCache) : IAuthenticationService
{
    public AuthenticationResponse SignUp(UserRequest request)
    {
        if (request.FirstName == null)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "First name is required"
            };
        }
        
        if (request.LastName == null)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Last name is required"
            };
        }
        
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            Role = UserRole.User,
            Avatar = s3StorageService.GetAvatarPlaceholder().Result
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
    
    public async Task<AuthenticationResponse> SignUpAsync(UserRequest request)
    {
        if (request.FirstName == null)
        {
            return new AuthenticationResponse()
            {
                Success = false,
                Error = "First name is required"
            };
        }
        
        if (request.LastName == null)
        {
            return new AuthenticationResponse()
            {
                Success = false,
                Error = "Last name is required"
            };
        }

        var placeholder = await s3StorageService.GetAvatarPlaceholder();
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            Role = UserRole.User,
            Avatar = placeholder
        };

        if (await dbContext.Users.AnyAsync(u => u.Email == user.Email))
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "User with this email already exists!"
            };
        }
        
        user.Password = HashPassword(user, request.Password);

        await dbContext.Users.AddAsync(user);
        await dbContext.SaveChangesAsync();

        return await SignInAsync(request);
    }

    public AuthenticationResponse SignIn(UserRequest request)
    {
        var user =  dbContext.Users.FirstOrDefault(u => u.Email == request.Email);

        if (user == null || !VerifyPassword(user, user.Password, request.Password))
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Wrong credentials"
            };
        }

        var token = Guid.NewGuid().ToByteArray();
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(3),
            SlidingExpiration = TimeSpan.FromHours(1)
        };
        distributedCache.Set(user.Id.ToString(), token, options);

        return new AuthenticationResponse
        {
            Success = true,
            UserId = user.Id.ToString(),
            Token = Convert.ToBase64String(token)
        };
    }

    public async Task<AuthenticationResponse> SignInAsync(UserRequest request)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !VerifyPassword(user, user.Password, request.Password))
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Wrong credentials"
            };
        }

        var token = Guid.NewGuid().ToByteArray();
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(3),
            SlidingExpiration = TimeSpan.FromHours(1)
        };
        await distributedCache.SetAsync(user.Id.ToString(), token, options);

        return new AuthenticationResponse
        {
            Success = true,
            UserId = user.Id.ToString(),
            Token = Convert.ToBase64String(token)
        };
    }
    
    public AuthenticationResponse SignOut(int id)
    {
        try
        {
            distributedCache.Remove(id.ToString());
        }
        catch (Exception)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Invalid token"
            };
        }

        return new AuthenticationResponse
        {
            Success = true
        };
    }

    public async Task<AuthenticationResponse> SignOutAsync(int id)
    {
        try
        {
            await distributedCache.RemoveAsync(id.ToString());
        }
        catch (Exception)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Invalid token"
            };
        }

        return new AuthenticationResponse
        {
            Success = true
        };
    }

    public int? CheckAuthentication(HttpContext context, UserRole? role = null)
    {
        var userId = GetUserIdFromContext(context);
        if (userId == null)
        {
            return null;
        }

        if (role.HasValue)
        {
            var user = dbContext.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return null;
            }
            
            return user.Role == role ? user.Id : null;
        }

        context.Response.StatusCode = StatusCodes.Status200OK;
        return userId;
    }
    
    public async Task<int?> CheckAuthenticationAsync(HttpContext context, UserRole? role = null)
    {
        var userId = await GetUserIdFromContextAsync(context);
        if (userId == null)
        {
            return null;
        }
        
        if (role.HasValue)
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return null;
            }
            
            return user.Role == role ? user.Id : null;
        }

        context.Response.StatusCode = StatusCodes.Status200OK;
        return userId;
    }
    
    private int? GetUserIdFromContext(HttpContext context)
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
        
        var matchingUserId = dbContext.Users
            .Select(u => u.Id) 
            .AsEnumerable()   
            .FirstOrDefault(id => {
                var storedTokenBytes = distributedCache.Get(id.ToString());
                return storedTokenBytes != null && Convert.ToBase64String(storedTokenBytes) == clientToken;
            });
        
        if (matchingUserId != 0)
        {
            return matchingUserId;
        }
        
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return null;
    }

    private async Task<int?> GetUserIdFromContextAsync(HttpContext context)
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
        
        var usersIds = await dbContext.Users
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var id in usersIds)
        {
            var storedTokenBytes = await distributedCache.GetAsync(id.ToString());
            if (storedTokenBytes != null && Convert.ToBase64String(storedTokenBytes) == clientToken)
            {
                return id;
            }
        }
        
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
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
