using Crux.Models;
using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("admin")]
public class AdminController (
    IApplicationAuthService authenticationService,
    IApplicationUserService userService) : ControllerBase
{
    [HttpGet("get-users")]
    public Response GetUsers()
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var usersInfo = userService.GetUsersInfo(HttpContext);

            return new ControllerResponse<ICollection<KeyValuePair<int, UserResponse>>>
            {
                Success = true,
                Body = usersInfo
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpPost("create-lesson")]
    public Response CreateLesson([FromBody] Lesson lesson)
    {
        throw new NotImplementedException();
    }

    [HttpPost("create-card")]
    public Response CreateCard([FromBody] Card card)
    {
        throw new NotImplementedException();
    }
}
