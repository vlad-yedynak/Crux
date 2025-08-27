using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.EntityTypes;
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
            (a.ExpiresAt == null || a.ExpiresAt > DateTime.UtcNow));
    }

    public async Task GrantAccessToLessonAsync(int userId, int lessonId, DateTime? expiresAt = null)
    {
        if (await dbContext.Set<UserLessonAccess>()
                .AnyAsync(a => a.UserId == userId && a.LessonId == lessonId))
            return;
        
        var user = await dbContext.Users.FindAsync(userId);
        var lesson = await dbContext.Lessons.FindAsync(lessonId);
        
        if (user == null || lesson == null)
            return;

        dbContext.Set<UserLessonAccess>().Add(new UserLessonAccess
        {
            User = user,
            Lesson = lesson,
            UserId = userId,
            LessonId = lessonId,
            ExpiresAt = expiresAt
        });
        
        await dbContext.SaveChangesAsync();
    }

    public async Task RevokeAccessToLessonAsync(int userId, int lessonId)
    {
        var access = await dbContext.Set<UserLessonAccess>()
            .FirstOrDefaultAsync(a => a.UserId == userId && a.LessonId == lessonId);

        if (access != null)
        {
            dbContext.Set<UserLessonAccess>().Remove(access);
            await dbContext.SaveChangesAsync();
        }
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