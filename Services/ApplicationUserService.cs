using Crux.Data;
using Crux.Models;
using Crux.Models.Responses;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class ApplicationUserService(
    IApplicationAuthService applicationAuthService,
    ApplicationDbContext dbContext,
    IDistributedCache distributedCache) : IApplicationUserService
{
    public UserResponse GetUserInfoFromContext(HttpContext context)
    {
        var userId = applicationAuthService.GetUserIdFromToken(context);

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
        var user = dbContext.Users.FirstOrDefault(u => u.Id == userId);
        
        if (user != null)
        {
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = user.ScorePoints,
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

    public bool CheckUserRole(HttpContext context, UserRole role)
    {
        return GetUserInfoFromContext(context).UserRole == role.ToString();
    }

    public ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context)
    {
        var users = new List<KeyValuePair<int, UserResponse>>();
        
        dbContext.Users.Select(u => u.Id)
            .ToList()
            .ForEach(id =>
            {
                users.Add(new KeyValuePair<int, UserResponse>(id, GetUserInfoFromId(context, id)));
            });
        
        return users;
    }
}
