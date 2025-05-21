using Crux.Data;
using Crux.Models.Entities;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.EntityFrameworkCore;

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
            
            dbContext.SaveChanges();
            
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
    
    public async Task<LessonTrackerResponse> UpdateLessonTimeAsync(HttpContext context, LessonTrackerRequest request)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);
        
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
        
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
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
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == request.LessonId);
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

        var tracker = await dbContext.LessonTrackers.FirstOrDefaultAsync(t => t.LessonId == request.LessonId && t.UserId == userId);
        if (tracker == null)
        {
            await dbContext.LessonTrackers.AddAsync(new LessonTracker
            {
                UserId = request.UserId,
                LessonId = request.LessonId,
                TrackedTime = request.TrackedTime
            });
            
            await dbContext.SaveChangesAsync();
            
            return new LessonTrackerResponse
            {
                TrackedTime = request.TrackedTime,
                Success = true
            };
        }
        
        tracker.TrackedTime += request.TrackedTime;
        await dbContext.SaveChangesAsync();
        
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
    
    public async Task<LessonTrackerResponse> ResetLessonTimeAsync(HttpContext context, int lessonId)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);
        
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
        
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
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
        
        var lesson = await dbContext.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId);
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

        var tracker = await dbContext.LessonTrackers.FirstOrDefaultAsync(t => t.LessonId == lessonId && t.UserId == userId);
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
        await dbContext.SaveChangesAsync();
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
        
        var userTrackers = dbContext.LessonTrackers
            .Where(t => t.UserId == userId.Value)
            .ToList();
        
        foreach (var tracker in userTrackers)
        {
                tracker.TrackedTime = 0;
        }
        
        dbContext.SaveChanges();

        return new LessonTrackerResponse
        {
            TrackedTime = 0,
            Success = true
        };
    }
    
    public async Task<LessonTrackerResponse> ResetAllAsync(HttpContext context)
    {
        var userId = await authenticationService.GetUserIdFromContextAsync(context);
        
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
        
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
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
        
        var userTrackers = await dbContext.LessonTrackers
            .Where(t => t.UserId == userId.Value)
            .ToListAsync();
        
        foreach (var tracker in userTrackers)
        {
            tracker.TrackedTime = 0;
        }
        
        await dbContext.SaveChangesAsync();

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
