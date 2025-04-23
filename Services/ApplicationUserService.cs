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
    public UserResponse GetUserInfo(HttpContext context)
    {
        if (applicationAuthService.CheckAuthentication(context) == false)
        {
            return new UserResponse
            {
                Success = false,
                Error = "Invalid session token"
            };
        }

        // TODO: Get user by session token
        User? user = null;

        if (user == null)
        {
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