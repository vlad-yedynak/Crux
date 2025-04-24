using Crux.Data;
using Crux.Models.Responses;
using Microsoft.Extensions.Caching.Distributed;

namespace Crux.Services;

public class ApplicationUserService(
    IApplicationAuthService applicationAuthService,
    ApplicationDbContext dbContext,
    IDistributedCache distributedCache) : IApplicationUserService
{
    public UserResponse GetUserInfo(HttpContext context)
    {
        var userId = applicationAuthService.GetUserIdFromToken(context);

        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new UserResponse
            {
                Success = false,
                Error = "Unauthorized access"
            };
        }

        var user = dbContext.Users.FirstOrDefault(u => u.Id == userId.Value);
        
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new UserResponse
            {
                Success = false,
                Error = "Can't find user info"
            };
        }
        
        return new UserResponse
        {
            Success = true,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            ScorePoints = user.ScorePoints,
        };
    }
}