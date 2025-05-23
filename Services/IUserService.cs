using Crux.Models.Responses;

namespace Crux.Services;

public interface IUserService
{
    UserResponse GetUserInfo(int id);
    Task<UserResponse> GetUserInfoAsync(int id);
        
    ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo();
    Task<ICollection<KeyValuePair<int, UserResponse>>> GetUsersInfoAsync();
    
    UserResponse ChangeFirstName(int id, string firstName);
    Task<UserResponse> ChangeFirstNameAsync(int id, string firstName);
    
    UserResponse ChangeLastName(int id, string lastName);
    Task<UserResponse> ChangeLastNameAsync(int id, string lastName);
    
    Task<UserResponse> UpdateAvatarAsync(int id, string url);
}
