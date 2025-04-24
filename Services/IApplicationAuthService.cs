using Crux.Models;
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
    AuthResponse SignOut(HttpContext context);

    [HttpHead]
    int? GetUserIdFromToken(HttpContext context);

    [HttpHead]
    bool CheckAuthentication(HttpContext context, UserRole? role = null);
}
