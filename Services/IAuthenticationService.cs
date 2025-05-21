using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IAuthenticationService
{
    AuthenticationResponse SignIn(UserRequest request);
    Task<AuthenticationResponse> SignInAsync(UserRequest request);

    AuthenticationResponse SignUp(UserRequest request);
    Task<AuthenticationResponse> SignUpAsync(UserRequest request);
    
    AuthenticationResponse SignOut(HttpContext context);
    Task<AuthenticationResponse> SignOutAsync(HttpContext context);

    int? GetUserIdFromContext(HttpContext context);
    Task<int?> GetUserIdFromContextAsync(HttpContext context);

    bool CheckAuthentication(HttpContext context, UserRole? role = null);
    Task<bool> CheckAuthenticationAsync(HttpContext context, UserRole? role = null);
}
