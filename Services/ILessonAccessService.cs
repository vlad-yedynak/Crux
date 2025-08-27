namespace Crux.Services;

public interface ILessonAccessService
{
    Task<bool> HasAccessToLessonAsync(int userId, int lessonId);
    
    Task GrantAccessToLessonAsync(int userId, int lessonId, DateTime? expiresAt = null);
    
    Task RevokeAccessToLessonAsync(int userId, int lessonId);
    
    Task<List<int>> GetAccessibleLessonsAsync(int userId);
}