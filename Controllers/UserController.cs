using Crux.Models.EntityTypes;
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
    public async Task<ActionResult<Response>> SignUpAsync([FromBody] UserRequest request)
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = await authenticationService.SignUpAsync(request)
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
    public async Task<ActionResult<Response>> SignInAsync([FromBody] UserRequest request)
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = await authenticationService.SignInAsync(request)
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
    public new async Task<ActionResult<Response>> SignOutAsync()
    {
        try
        {
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = await authenticationService.SignOutAsync(HttpContext)
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
    public async Task<ActionResult<Response>> InfoAsync()
    {
        try
        {
            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = await userService.GetUserInfoFromContextAsync(HttpContext)
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
    public async Task<ActionResult<Response>> GetUsersAsync()
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var usersInfo = await userService.GetUsersInfoAsync(HttpContext);

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
    public async Task<ActionResult<Response>> ChangeFirstNameAsync([FromBody] string firstName)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = await userService.ChangeFirstNameAsync(HttpContext, firstName);

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
    public async Task<ActionResult<Response>> ChangeLastNameAsync([FromBody] string lastName)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = await userService.ChangeLastNameAsync(HttpContext, lastName);

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
