using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IApplicationAuthService
{
    [HttpPost]
    AuthResponse SignIn(UserSignInRequest request);
    
    [HttpPost]
    AuthResponse SignUp(UserSignUpRequest request);
    
    [HttpGet]
    AuthResponse SignOut(HttpContext httpContext);

    [HttpHead]
    string GetUserIdFromToken(string token);
    
    [HttpHead]
    bool CheckAuthentication(HttpContext httpContext);
}
