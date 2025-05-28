using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonService
{
    ICollection<LessonResponse> GetLessons();
    Task<ICollection<LessonResponse>> GetLessonsAsync();
    
    LessonResponse AddLesson(string title);
    Task<LessonResponse> AddLessonAsync(string title);

    LessonResponse UpdateLessonName(UpdateLessonRequest request);
    Task<LessonResponse> UpdateLessonNameAsync(UpdateLessonRequest request);
    
    bool DeleteLesson(int id);
    Task<bool> DeleteLessonAsync(int id);
}
