using Microsoft.AspNetCore.Mvc;
using Crux.Models.EntityTypes;
using Crux.Models.Responses;
using Crux.Models.Requests;
using Crux.Services;

namespace Crux.Controllers;

[Route("lesson")]
public class LessonsController (IAuthenticationService authenticationService, ILessonService lessonService) : ControllerBase
{
    [HttpPost("create-lesson")]
    public async Task<ActionResult<Response>> CreateLessonAsync([FromBody] string title)
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
            
            var response = await lessonService.AddLessonAsync(title);

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
            var lessons = await lessonService.GetLessonsAsync();

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
}
