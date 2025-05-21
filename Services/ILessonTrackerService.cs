using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonTrackerService
{
    LessonTrackerResponse UpdateLessonTime(HttpContext context, LessonTrackerRequest request);
    Task<LessonTrackerResponse> UpdateLessonTimeAsync(HttpContext context, LessonTrackerRequest request);
    
    LessonTrackerResponse ResetLessonTime(HttpContext context, int lessonId);
    Task<LessonTrackerResponse> ResetLessonTimeAsync(HttpContext context, int lessonId);
    
    LessonTrackerResponse ResetAll(HttpContext context);
    Task<LessonTrackerResponse> ResetAllAsync(HttpContext context);
    
    UserFeedResponse GetUserFeed(HttpContext context);
}
