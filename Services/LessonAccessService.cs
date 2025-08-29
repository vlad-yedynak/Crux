using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace Crux.Services;

public class LessonAccessService(ApplicationDbContext dbContext) : ILessonAccessService
{
    public async Task<bool> HasAccessToLessonAsync(int userId, int lessonId)
    {
        var user = await dbContext.Users.FindAsync(userId);
        
        if (user == null)
            return false;
        
        if (user.Role == UserRole.Admin)
            return true;
        
        var lesson = await dbContext.Lessons.FindAsync(lessonId);
        
        if (lesson == null)
            return false;

        if (lesson.Visibility == LessonVisibility.Public)
         return true;
        
        return await dbContext.Set<UserLessonAccess>()
            .AnyAsync(a => 
            a.UserId == userId && 
            a.LessonId == lessonId &&
            !a.IsBanned &&
            (a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow));
    }
    
    public async Task GrantAccessToLessonAsync(LessonAccessRequest request)
    {
        var lesson = await dbContext.Lessons.FindAsync(request.LessonId);
        if (lesson == null)
            return;
        
        if (lesson.Visibility == LessonVisibility.Public)
            return;
        
        var accessEntries = await dbContext.Set<UserLessonAccess>()
            .Where(a => request.LessonId == a.LessonId && request.UserIds.Contains(a.UserId))
            .ToListAsync();
        
        var existingUserIds = new HashSet<int>();
        
        foreach (var entry in accessEntries)
        {
            existingUserIds.Add(entry.UserId);
            entry.IsBanned = false;
            entry.BannedAt = null;
            entry.BanReason = null;
            entry.ExpiresAt = request.ExpiresAt;
        }
        
        if (lesson.Visibility != LessonVisibility.Public)
        {
            var newUserIds = request.UserIds.Except(existingUserIds).ToList();
            if (newUserIds.Any())
            {
                var newEntries = newUserIds.Select(userId => new UserLessonAccess
                {
                    UserId = userId,
                    LessonId = request.LessonId,
                    ExpiresAt = request.ExpiresAt,
                    User = null!,
                    Lesson = null!
                }).ToList();
                
                await dbContext.Set<UserLessonAccess>().AddRangeAsync(newEntries);
            }
        }
        
        await dbContext.SaveChangesAsync();
    }

    public async Task RevokeAccessToLessonAsync(LessonRevokeRequest request)
    {
        var existingAccessEntries = await dbContext.Set<UserLessonAccess>()
            .Where(a => a.LessonId == request.LessonId && request.UserIds.Contains(a.UserId))
            .ToListAsync();
        
        foreach (var entry in existingAccessEntries)
        {
            entry.IsBanned = true;
            entry.BannedAt = DateTime.UtcNow;
        }
        
        var existingUserIds = existingAccessEntries.Select(e => e.UserId).ToHashSet();
        var userIdsToCreateBanFor = request.UserIds.Except(existingUserIds).ToList();
        
        if (userIdsToCreateBanFor.Any())
        {
            var newBanEntries = userIdsToCreateBanFor.Select(userId => new UserLessonAccess
            {
                UserId = userId,
                LessonId = request.LessonId,
                IsBanned = true,
                BannedAt = DateTime.UtcNow,
                BanReason = request.BanReason,
                User = null!,
                Lesson = null!
            });

            await dbContext.Set<UserLessonAccess>().AddRangeAsync(newBanEntries);
        }

        await dbContext.SaveChangesAsync();
    }

    public async Task<List<int>> GetAccessibleLessonsAsync(int userId)
    {
        var user = await dbContext.Users.FindAsync(userId);

        if (user?.Role == UserRole.Admin)
        {
            return await dbContext.Lessons.Select(l => l.Id).ToListAsync();
        }
        
        var publicLessonIds = await dbContext.Lessons
            .Where(l => l.Visibility == LessonVisibility.Public)
            .Select(l => l.Id)
            .ToListAsync();
        
        var privateLessonIds = await dbContext.Set<UserLessonAccess>()
            .Where(a => a.UserId == userId &&
                        (a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow))
            .Select(a => a.LessonId)
            .ToListAsync();
        
        return publicLessonIds.Concat(privateLessonIds).Distinct().ToList();
    }
}