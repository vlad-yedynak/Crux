using Crux.Models;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IAuthenticationService
{
    AuthenticationResponse SignIn(UserRequest request);
    
    AuthenticationResponse SignUp(UserRequest request);
    
    AuthenticationResponse SignOut(HttpContext context);

    int? GetUserIdFromContext(HttpContext context);

    bool CheckAuthentication(HttpContext context, UserRole? role = null);
}
