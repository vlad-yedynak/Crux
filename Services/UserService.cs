using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class UserService(
    ApplicationDbContext dbContext,
    IWebHostEnvironment webHostEnvironment) : IUserService
{
    public UserResponse GetUserInfo(int userId)
    {
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == userId);
        
        if (user != null)
        {
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    public async Task<UserResponse> GetUserInfoAsync(int id)
    {
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == id);
        
        if (user != null)
        {
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                AvatarUrl = user.Avatar,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    public ICollection<KeyValuePair<int, UserResponse>> GetUsersInfo()
    {
        var users = new List<KeyValuePair<int, UserResponse>>();
        
        dbContext.Users
            .Select(u => u.Id)
            .ToList()
            .ForEach(userId =>
            {
                users.Add(new KeyValuePair<int, UserResponse>(userId, GetUserInfo(userId)));
            });
        
        return users;
    }
    
    public async Task<ICollection<KeyValuePair<int, UserResponse>>> GetUsersInfoAsync()
    {
        var users = new List<KeyValuePair<int, UserResponse>>();

        var userIds = await dbContext.Users
            .Select(u => u.Id)
            .ToListAsync();

        foreach (var id in userIds)
        {
            users.Add(new KeyValuePair<int, UserResponse>(id, await GetUserInfoAsync(id)));
        }
        
        return users;
    }

    public UserResponse ChangeFirstName(int id, string firstName)
    {
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == id);
        
        if (user != null)
        {
            user.FirstName = firstName;
            dbContext.SaveChanges();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    public async Task<UserResponse> ChangeFirstNameAsync(int id, string firstName)
    {
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == id);
        
        if (user != null)
        {
            user.FirstName = firstName;
            await dbContext.SaveChangesAsync();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    public UserResponse ChangeLastName(int id, string lastName)
    {
        var user = dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefault(u => u.Id == id);
        
        if (user != null)
        {
            user.LastName = lastName;
            dbContext.SaveChanges();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }
    
    public async Task<UserResponse> ChangeLastNameAsync(int id, string lastName)
    {
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == id);
        
        if (user != null)
        {
            user.LastName = lastName;
            await dbContext.SaveChangesAsync();
            
            return new UserResponse
            {
                Success = true,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                ScorePoints = GetUserScorePoints(user.ScorePoints),
                UserRole = user.Role.ToString()
            };
        }
        
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    public async Task<UserResponse> UpdateAvatarAsync(int id, string url)
    {
        var user = await dbContext.Users
            .Include(u => u.ScorePoints)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return new UserResponse
            {
                Success = false,
                Error = "Can't find user info"
            };
        }

        if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return new UserResponse
            {
                Success = false,
                Error = "Url is empty"
            };
        }

        var uploadUrl = Path.Combine(webHostEnvironment.WebRootPath, "uploads", "avatars", user.Id.ToString());

        if (!Directory.Exists(uploadUrl))
        {
            Directory.CreateDirectory(uploadUrl);
        }

        try
        {  
            var client = new HttpClient();
            var response = await client.GetAsync(url);

            if (response.IsSuccessStatusCode)
            {
                var imageResponse = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.MediaType;

                if (contentType == null)
                {
                    return new UserResponse
                    {
                        Success = false,
                        Error = "Invalid avatar"
                    };
                }
                
                var extension = Path.GetExtension(uri.AbsolutePath);
                if (string.IsNullOrWhiteSpace(extension) || extension.Length > 5)
                {
                    if (contentType.Equals("image/jpeg", StringComparison.OrdinalIgnoreCase)) extension = ".jpg";
                    else if (contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
                    else if (contentType.Equals("image/gif", StringComparison.OrdinalIgnoreCase)) extension = ".gif";
                    else if (contentType.Equals("image/webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
                    else extension = ".img";
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadUrl, fileName);
                await File.WriteAllBytesAsync(filePath, imageResponse);
                
                var serverUrl = $"/uploads/avatars/{user.Id}/{fileName}";
                
                user.Avatar = serverUrl;
                await dbContext.SaveChangesAsync();
                
                return new UserResponse
                {
                    Success = true,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    ScorePoints = GetUserScorePoints(user.ScorePoints),
                    UserRole = user.Role.ToString(),
                    AvatarUrl = serverUrl
                };
            }
            else
            {
                return new UserResponse
                {
                    Success = false,
                    Error = "Failed to download avatar"
                };
            }
        }
        catch (Exception ex)
        {
            return new UserResponse
            {
                Success = false,
                Error = "Failed to save avatar"
            };
        }
    }

    private static Dictionary<int, int> GetUserScorePoints(ICollection<UserLessonProgress> progresses)
    {
        var scorePoints = new Dictionary<int, int>();

        progresses.ToList().ForEach(p =>
        {
            scorePoints[p.LessonId] = p.ScorePoint;
        });
        
        return scorePoints;
    }
}
