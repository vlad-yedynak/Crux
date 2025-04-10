using Crux.Services;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("user")]
public class UserController : ControllerBase
{
    private readonly IApplicationAuthService _authenticationService;

    public UserController(IApplicationAuthService authenticationService)
    {
        _authenticationService = authenticationService;
    }
    
    [HttpPost("sign-up")]
    public IResponse SignUp([FromBody] UserSignUpRequest request)
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = _authenticationService.SignUp(request)
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
    public IResponse SignIn([FromBody] UserSignInRequest request)
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = _authenticationService.SignIn(request)
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
    public IResponse SignOut()
    {
        try
        {
            return new ControllerResponse<AuthResponse>
            {
                Success = true,
                Body = _authenticationService.SignOut(HttpContext)
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
