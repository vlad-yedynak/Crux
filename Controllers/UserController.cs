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
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
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
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }

    [HttpGet("sign-out")]
    public async Task<ActionResult<Response>> SignOutAsync()
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = true,
                Body = await authenticationService.SignOutAsync(userId.Value)
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }

    [HttpGet("info")]
    public async Task<ActionResult<Response>> InfoAsync()
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = await userService.GetUserInfoAsync(userId.Value)
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<UserResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpGet("get-users")]
    public async Task<ActionResult<Response>> GetUsersAsync()
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var usersInfo = await userService.GetUsersInfoAsync();

            return new ControllerResponse<ICollection<KeyValuePair<int, UserResponse>>>
            {
                Success = true,
                Body = usersInfo
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<UserResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("change-first-name")]
    public async Task<ActionResult<Response>> ChangeFirstNameAsync([FromBody] string firstName)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = await userService.ChangeFirstNameAsync(userId.Value, firstName);

            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = user
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<UserResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("change-last-name")]
    public async Task<ActionResult<Response>> ChangeLastNameAsync([FromBody] string lastName)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = await userService.ChangeLastNameAsync(userId.Value, lastName);

            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = user
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<UserResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("update-avatar")]
    public async Task<ActionResult<Response>> UpdateAvatarAsync([FromBody] string url)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var user = await userService.UpdateAvatarAsync(userId.Value, url);

            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = user
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<UserResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
}

// TODO: move repeating code sections across all controllers to middleware :P
