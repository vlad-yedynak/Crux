using Crux.Models;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface IUserService
{
    UserResponse GetUserInfoFromContext(HttpContext context);
    Task<UserResponse> GetUserInfoFromContextAsync(HttpContext context);
    
    ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo(HttpContext context);
    Task<ICollection<KeyValuePair<int, UserResponse>>> GetUsersInfoAsync(HttpContext context);
    
    UserResponse ChangeFirstName(HttpContext context, string firstName);
    Task<UserResponse> ChangeFirstNameAsync(HttpContext context, string firstName);
    
    UserResponse ChangeLastName(HttpContext context, string lastName);
    Task<UserResponse> ChangeLastNameAsync(HttpContext context, string lastName);
}
