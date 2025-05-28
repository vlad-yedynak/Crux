using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

namespace Crux.Services;

public class UserService(
    ApplicationDbContext dbContext,
    IWebHostEnvironment webHostEnvironment,
    IS3StorageService s3StorageService) : IUserService
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

    public async Task<UserResponse> UpdateAvatarAsync(int id, UpdateAvatarRequest request)
{
    var user = await dbContext.Users
        .FirstOrDefaultAsync(u => u.Id == id);

    if (user == null)
    {
        return new UserResponse
        {
            Success = false,
            Error = "Can't find user info"
        };
    }

    if (string.IsNullOrWhiteSpace(request.Data))
    {
        return new UserResponse
        {
            Success = false,
            Error = "Image data is required"
        };
    }

    if (string.IsNullOrWhiteSpace(request.ContentType))
    {
        return new UserResponse
        {
            Success = false,
            Error = "Image content type is required"
        };
    }

    byte[] imageBytes;
    try
    {
        imageBytes = Convert.FromBase64String(request.Data);
    }
    catch (FormatException)
    {
        return new UserResponse
        {
            Success = false,
            Error = "Invalid Base64 image data"
        };
    }
    
    if (imageBytes.Length > 5 * 1024 * 1024) 
    {
        return new UserResponse
        {
            Success = false,
            Error = "Image size exceeds 5MB limit"
        };
    }

    var extension = request.ContentType.ToLowerInvariant() switch
    {
        "image/jpeg" => ".jpg",
        "image/jpg" => ".jpg",
        "image/png" => ".png",
        "image/gif" => ".gif",
        "image/webp" => ".webp",
        _ => null 
    };

    if (extension == null)
    {
        return new UserResponse
        {
            Success = false,
            Error = "Unsupported image type. Please use JPEG, PNG, GIF, or WEBP."
        };
    }

    var s3FolderPath = $"uploads/avatars/{id}";
    var fileName = $"{Guid.NewGuid()}{extension}";
    string oldAvatarUrl = user.Avatar;

    try
    {  
        var newS3Url = await s3StorageService.UploadFileAsync(imageBytes, s3FolderPath, fileName);
        
        user.Avatar = newS3Url;
        await dbContext.SaveChangesAsync();
        
        if (!string.IsNullOrEmpty(oldAvatarUrl) && 
            !oldAvatarUrl.Contains("defaultAvatar") &&
            oldAvatarUrl != newS3Url)
        {
            try
            {
                await s3StorageService.DeleteFileAsync(oldAvatarUrl);
            }
            catch(Exception exDelete)
            {
                Console.WriteLine($"Failed to delete old avatar {oldAvatarUrl} for user {id}: {exDelete.Message}");
            }
        }
            
        return new UserResponse
        {
            Success = true,
            AvatarUrl = newS3Url
        };
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error updating avatar for user {id}: {ex.Message}");
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
