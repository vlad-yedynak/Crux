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
    IPasswordHasher<User> passwordHasher,
    IDistributedCache distributedCache) : IAuthenticationService
{
    public AuthenticationResponse SignUp(UserRequest request)
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
        
        if (request.Email == null)
        {
            return new AuthenticationResponse()
            {
                Success = false,
                Error = "Email is required"
            };
        }
        
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
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
        
        if (request.Email == null)
        {
            return new AuthenticationResponse()
            {
                Success = false,
                Error = "Email is required"
            };
        }
        
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Password = request.Password,
            Role = UserRole.User
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
          distributedCache.Set(user.Id.ToString(), token);

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
        await distributedCache.SetAsync(user.Id.ToString(), token);

        return new AuthenticationResponse
        {
            Success = true,
            UserId = user.Id.ToString(),
            Token = Convert.ToBase64String(token)
        };
    }
    
    public AuthenticationResponse SignOut(HttpContext context)
    {
        
        var userId = GetUserIdFromContext(context);

        if (!userId.HasValue)
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

    public async Task<AuthenticationResponse> SignOutAsync(HttpContext context)
    {
        
        var userId = await GetUserIdFromContextAsync(context);

        if (!userId.HasValue)
        {
            return new AuthenticationResponse
            {
                Success = false,
                Error = "Invalid token"
            };
        }

        await distributedCache.RemoveAsync(userId.Value.ToString());

        return new AuthenticationResponse
        {
            Success = true
        };
    }

    public bool CheckAuthentication(HttpContext context, UserRole? role = null)
    {

        var userId = GetUserIdFromContext(context);

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
    
    public async Task<bool> CheckAuthenticationAsync(HttpContext context, UserRole? role = null)
    {

        var userId = await GetUserIdFromContextAsync(context);

        if (userId == null)
        {
            return false;
        }

        if (role.HasValue)
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return false;
            }
            
            return user.Role == role;
        }

        context.Response.StatusCode = StatusCodes.Status200OK;
        return true;
    }
    
    public int? GetUserIdFromContext(HttpContext context)
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

    public async Task<int?> GetUserIdFromContextAsync(HttpContext context)
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
