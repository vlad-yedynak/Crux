using Crux.Services;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("user")]
public class UserController (
    IApplicationAuthService authenticationService,
    IApplicationUserService applicationUserService) : ControllerBase
{
    [HttpPost("sign-up")]
    public Response SignUp([FromBody] UserSignUpRequest request)
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = authenticationService.SignUp(request)
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

    [HttpPost("sign-in")]
    public Response SignIn([FromBody] UserSignInRequest request)
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = authenticationService.SignIn(request)
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

    [HttpGet("sign-out")]
    public new Response SignOut()
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = authenticationService.SignOut(HttpContext)
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

    [HttpGet("info")]
    public Response Info()
    {
        try
        {
            return new ControllerResponse<UserResponse>
            {
                Success = true,
                Body = applicationUserService.GetUserInfo(HttpContext)
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
}
