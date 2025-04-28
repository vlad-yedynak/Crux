using Crux.Models;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IUserService
{
    [HttpGet]
    UserResponse GetUserInfoFromContext(HttpContext context);
    
    [HttpGet]
    ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context);
    
    [HttpPost]
    UserResponse ChangeFirstName(HttpContext context, string firstName);
    
    [HttpPost]
    UserResponse ChangeLastName(HttpContext context, string lastName);
}
