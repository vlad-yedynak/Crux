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
