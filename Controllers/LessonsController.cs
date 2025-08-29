using Microsoft.AspNetCore.Mvc;
using Crux.Models.EntityTypes;
using Crux.Models.Responses;
using Crux.Models.Requests;
using Crux.Services;

namespace Crux.Controllers;

[Route("lesson")]
public class LessonsController (IAuthenticationService authenticationService, 
                                ILessonService lessonService,
                                ILessonAccessService lessonAccessService) : ControllerBase
{
    [HttpPost("create-lesson")]
    public async Task<ActionResult<Response>> CreateLessonAsync([FromBody] LessonRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonService.AddLessonAsync(request);

            return new ControllerResponse<LessonResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("update-lesson")]
    public async Task<ActionResult<Response>> UpdateLessonAsync([FromBody] UpdateLessonRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonService.UpdateLessonNameAsync(request);

            return new ControllerResponse<LessonResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpDelete("delete-lesson/{id:int}")]
    public async Task<ActionResult<Response>> UpdateLessonAsync(int id)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonService.DeleteLessonAsync(id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpGet("get-lessons")]
    public async Task<ActionResult<Response>> GetLessonsAsync()
    {
        try
        {
            int? userId = await authenticationService.GetUserIdFromContextAsync(HttpContext);
            var lessons = await lessonService.GetLessonsAsync(userId);

            return new ControllerResponse<ICollection<LessonResponse>>
            {
                Success = true,
                Body = lessons
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }

    [HttpPost("grant-access")]
    public async Task<ActionResult<Response>> GrantAccessAsync([FromBody] LessonAccessRequest request)
    {
        try
        {
            var adminId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (adminId == null)
            {
                HttpContext.Response.StatusCode = 403;
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Not authorized to grant lesson access"
                };
            }
            
            await lessonAccessService.GrantAccessToLessonAsync(request);
            
            return new ControllerResponse<bool>
            {
                Success = true
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPost("revoke-access")]
    public async Task<ActionResult<Response>> RevokeAccessAsync([FromBody] LessonRevokeRequest request)
    {
        try
        {
            var adminId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (adminId == null)
            {
                HttpContext.Response.StatusCode = 403;
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Not authorized to revoke lesson access"
                };
            }
            
            await lessonAccessService.RevokeAccessToLessonAsync(request);
            
            return new ControllerResponse<bool>
            {
                Success = true
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpGet("check/{lessonId:int}")]
    public async Task<ActionResult<Response>> CheckAccessAsync(int lessonId)
    {
        try
        {
            var userId = await authenticationService.GetUserIdFromContextAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 403;
                return new ControllerResponse<bool>
                {
                    Success = true,
                    Body = false
                };
            }
            
            var hasAccess = await lessonAccessService.HasAccessToLessonAsync(userId.Value, lessonId);
            
            return new ControllerResponse<bool>
            {
                Success = true,
                Body = hasAccess
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpGet("accessible-lessons")]
    public async Task<ActionResult<Response>> GetAccessibleLessonsAsync()
    {
        try
        {
            var userId = await authenticationService.GetUserIdFromContextAsync(HttpContext);
            if (userId == null)
            {
                return new ControllerResponse<List<int>>
                {
                    Success = true,
                    Body = new List<int>()
                };
            }
            
            var lessonIds = await lessonAccessService.GetAccessibleLessonsAsync(userId.Value);
            
            return new ControllerResponse<List<int>>
            {
                Success = true,
                Body = lessonIds
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
}
