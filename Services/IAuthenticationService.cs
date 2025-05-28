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
    
    AuthenticationResponse SignOut(int id);
    Task<AuthenticationResponse> SignOutAsync(int id);
    
    int? CheckAuthentication(HttpContext context, UserRole? role = null);
    Task<int?> CheckAuthenticationAsync(HttpContext context, UserRole? role = null);
}
