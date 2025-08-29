using Crux.Models.Requests;

namespace Crux.Services;

public interface ILessonAccessService
{
    Task<bool> HasAccessToLessonAsync(int userId, int lessonId);
    
    Task GrantAccessToLessonAsync(LessonAccessRequest request);
    
    Task RevokeAccessToLessonAsync(LessonRevokeRequest request);
    
    Task<List<int>> GetAccessibleLessonsAsync(int userId);
}