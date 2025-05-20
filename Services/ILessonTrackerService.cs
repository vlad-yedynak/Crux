using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonTrackerService
{
    LessonTrackerResponse UpdateLessonTime(HttpContext context, LessonTrackerRequest request);
    
    LessonTrackerResponse ResetLessonTime(HttpContext context, int lessonId);
    
    LessonTrackerResponse ResetAll(HttpContext context);
    
    UserFeedResponse GetUserFeed(HttpContext context);
}
