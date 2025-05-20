using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public class LessonTrackerService(
    IAuthenticationService authenticationService,
    ApplicationDbContext dbContext) : ILessonTrackerService
{
    public LessonTrackerResponse UpdateLessonTime(HttpContext context, LessonTrackerRequest request)
    {
        var userId = authenticationService.GetUserIdFromContext(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Missing user ID"
            };
        }
        
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId.Value);
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson =  dbContext.Lessons.FirstOrDefault(l => l.Id == request.LessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = dbContext.LessonTrackers.FirstOrDefault(t => t.LessonId == request.LessonId && t.UserId == userId);
        if (tracker == null)
        {
            dbContext.LessonTrackers.Add(new LessonTracker
            {
                UserId = request.UserId,
                LessonId = request.LessonId,
                TrackedTime = request.TrackedTime
            });
            
            return new LessonTrackerResponse
            {
                TrackedTime = request.TrackedTime,
                Success = true
            };
        }
        
        tracker.TrackedTime += request.TrackedTime;
        dbContext.SaveChanges();
        
        return new LessonTrackerResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }

    public LessonTrackerResponse ResetLessonTime(HttpContext context, int lessonId)
    {
        var userId = authenticationService.GetUserIdFromContext(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Missing user ID"
            };
        }
        
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId.Value);
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        var lesson =  dbContext.Lessons.FirstOrDefault(l => l.Id == lessonId);
        if (lesson == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Lesson not found"
            };
        }

        var tracker = dbContext.LessonTrackers.FirstOrDefault(t => t.LessonId == lessonId && t.UserId == userId);
        if (tracker == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User has no tracked time in lesson"
            };
        }
        
        tracker.TrackedTime = 0;
        dbContext.SaveChanges();
        return new LessonTrackerResponse
        {
            TrackedTime = tracker.TrackedTime,
            Success = true
        };
    }

    public LessonTrackerResponse ResetAll(HttpContext context)
    {
        var userId = authenticationService.GetUserIdFromContext(context);
        
        if (!userId.HasValue)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "Missing user ID"
            };
        }
        
        var user =  dbContext.Users.FirstOrDefault(u => u.Id == userId.Value);
        if (user == null)
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return new LessonTrackerResponse
            {
                TrackedTime = 0,
                Success = false,
                Error = "User not found"
            };
        }
        
        foreach (var lesson in dbContext.Lessons)
        {
            var tracker = dbContext.LessonTrackers.FirstOrDefault(t => t.LessonId == lesson.Id && t.UserId == userId);
            if (tracker != null)
            {
                tracker.TrackedTime = 0;
            }
            
            dbContext.SaveChanges();
        }

        return new LessonTrackerResponse
        {
            TrackedTime = 0,
            Success = true
        };
    }

    // TODO: Create service for AI suggested feed content
    public UserFeedResponse GetUserFeed(HttpContext context)
    {
        throw new NotImplementedException();
    }
}
