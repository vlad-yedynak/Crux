using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Responses;
using Crux.Models.EntityTypes;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class UserService(
    IAuthenticationService authenticationService,
    ApplicationDbContext dbContext) : IUserService
{
    public UserResponse GetUserInfoFromContext(HttpContext context)
    {
        var userId = authenticationService.GetUserIdFromContext(context);

        if (userId.HasValue)
        {
            return GetUserInfoFromId(context, userId.Value);
        }
        
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return new UserResponse
        {
            Success = false,
            Error = "Unauthorized access"
        };
    }
    
    public async Task<UserResponse> GetUserInfoFromContextAsync(HttpContext context)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);

        if (userId.HasValue)
        {
            return await GetUserInfoFromIdAsync(context, userId.Value);
        }
        
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return new UserResponse
        {
            Success = false,
            Error = "Unauthorized access"
        };
    }

    private UserResponse GetUserInfoFromId(HttpContext context, int userId)
    {
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == userId);
        
        if (user != null)
        {
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    private async Task<UserResponse> GetUserInfoFromIdAsync(HttpContext context, int userId)
    {
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user != null)
        {
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    public ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context)
    {
        if (!authenticationService.CheckAuthentication(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return [];
        }
        
        var users = new List<KeyValuePair<int, UserResponse>>();
        
        dbContext.Users
            .Select(u => u.Id)
            .ToList()
            .ForEach(id =>
            {
                users.Add(new KeyValuePair<int, UserResponse>(id, GetUserInfoFromId(context, id)));
            });
        
        return users;
    }
    
    public async Task<ICollection<KeyValuePair<int, UserResponse>>> GetUsersInfoAsync(HttpContext context)
    {
        if (!await authenticationService.CheckAuthenticationAsync(context, UserRole.Admin))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return [];
        }
        
        var users = new List<KeyValuePair<int, UserResponse>>();

        var userIds = await dbContext.Users
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var id in userIds)
        {
            users.Add(new KeyValuePair<int, UserResponse>(id, await GetUserInfoFromIdAsync(context, id)));
        }
        
        return users;
    }

    public UserResponse ChangeFirstName(HttpContext context, string firstName)
    {
        var userId = authenticationService.GetUserIdFromContext(context);

        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new UserResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == userId);
        
        if (user != null)
        {
            user.FirstName = firstName;
            dbContext.SaveChanges();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    public async Task<UserResponse> ChangeFirstNameAsync(HttpContext context, string firstName)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);

        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new UserResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user != null)
        {
            user.FirstName = firstName;
            await dbContext.SaveChangesAsync();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    public UserResponse ChangeLastName(HttpContext context, string lastName)
    {
        var userId = authenticationService.GetUserIdFromContext(context);

        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new UserResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == userId);
        
        if (user != null)
        {
            user.LastName = lastName;
            dbContext.SaveChanges();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    public async Task<UserResponse> ChangeLastNameAsync(HttpContext context, string lastName)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);

        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new UserResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }
        
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user != null)
        {
            user.LastName = lastName;
            await dbContext.SaveChangesAsync();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    private Dictionary<int, int> GetUserScorePoints(ICollection<UserLessonProgress> progresses)
    {
        var scorePoints = new Dictionary<int, int>();

        progresses.ToList().ForEach(p =>
        {
            scorePoints[p.LessonId] = p.ScorePoint;
        });
        
        return scorePoints;
    }
}
