using Crux.Models;
using Crux.Services;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("user")]
public class UserController (
    IAuthenticationService authenticationService,
    IUserService userService) : ControllerBase
{
    [HttpPost("sign-up")]
    public Response SignUp([FromBody] UserRequest request)
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = authenticationService.SignUp(request)
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpPost("sign-in")]
    public Response SignIn([FromBody] UserRequest request)
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = authenticationService.SignIn(request)
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpGet("sign-out")]
    public new Response SignOut()
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = authenticationService.SignOut(HttpContext)
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpGet("info")]
    public Response Info()
    {
        try
        {
            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = userService.GetUserInfoFromContext(HttpContext)
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpGet("get-users")]
    public Response GetUsers()
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
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
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("change-first-name")]
    public Response ChangeFirstName([FromBody] string firstName)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = userService.ChangeFirstName(HttpContext, firstName);

            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = user
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("change-last-name")]
    public Response ChangeLastName([FromBody] string lastName)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = userService.ChangeLastName(HttpContext, lastName);

            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = user
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
}
