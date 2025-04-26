using Crux.Models;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IAuthenticationService
{
    [HttpPost]
    AuthenticationResponse SignIn(UserRequest request);
    
    [HttpPost]
    AuthenticationResponse SignUp(UserRequest request);
    
    [HttpGet]
    AuthenticationResponse SignOut(HttpContext context);

    [HttpHead]
    int? GetUserIdFromToken(HttpContext context);

    [HttpHead]
    bool CheckAuthentication(HttpContext context, UserRole? role = null);
}
