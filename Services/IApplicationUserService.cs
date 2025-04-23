using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IApplicationUserService
{
    [HttpGet]
    UserResponse GetUserInfo(HttpContext context);
}
