using Crux.Models;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IApplicationUserService
{
    [HttpGet]
    UserResponse GetUserInfoFromContext(HttpContext context);
    
    [HttpGet]
    ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context);
}
