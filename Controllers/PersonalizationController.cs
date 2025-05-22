using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;
using Crux.Models.Requests;

namespace Crux.Controllers;

[Route("tracker")]
public class PersonalizationController(
    IAuthenticationService authenticationService,
    IPersonalizationService trackerService) : ControllerBase
{
    [HttpPost("update-lesson-time")]
    public async Task<ActionResult<Response>> UpdateLessonTimeAsync([FromBody] PersonalizationRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await trackerService.UpdateLessonTimeAsync(userId.Value, request);

            return new ControllerResponse<PersonalizationResponse>
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
    
    [HttpDelete("reset-lesson-time/{id:int}")]
    public async Task<ActionResult<Response>> ResetLessonTimeAsync(int lessonId)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await trackerService.ResetLessonTimeAsync(userId.Value, lessonId);

            return new ControllerResponse<PersonalizationResponse>
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
    
    [HttpDelete("reset-all-time")]
    public async Task<ActionResult<Response>> ResetAllLessonTime()
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await trackerService.ResetAllAsync(userId.Value);

            return new ControllerResponse<PersonalizationResponse>
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
}
