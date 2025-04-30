using Crux.Models;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IUserService
{
    UserResponse GetUserInfoFromContext(HttpContext context);
    
    ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context);
    
    UserResponse ChangeFirstName(HttpContext context, string firstName);
    
    UserResponse ChangeLastName(HttpContext context, string lastName);
}
