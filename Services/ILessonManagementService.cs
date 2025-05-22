using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonManagementService
{
    ICollection<LessonResponse> GetLessons(HttpContext context);
    Task<ICollection<LessonResponse>> GetLessonsAsync(HttpContext context);
    
    LessonResponse AddLesson(HttpContext context, string title);
    Task<LessonResponse> AddLessonAsync(HttpContext context, string title);

    LessonResponse UpdateLessonName(HttpContext context, UpdateLessonRequest request);
    Task<LessonResponse> UpdateLessonNameAsync(HttpContext context, UpdateLessonRequest request);
    
    bool DeleteLesson(HttpContext context, int id);
    Task<bool> DeleteLessonAsync(HttpContext context, int id);
}
