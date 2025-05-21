using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;
using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Controllers;

[Route("tracker")]
public class LessonTrackerController(
    IAuthenticationService authenticationService,
    ILessonTrackerService trackerService) : ControllerBase
{

    [HttpPost("update-lesson-time")]
    public async Task<ActionResult<Response>> UpdateLessonTimeAsync([FromBody] LessonTrackerRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = await trackerService.UpdateLessonTimeAsync(HttpContext, request);

            return new ControllerResponse<LessonTrackerResponse>
            {
                Success = true,
                Body = response
            };
            
        }
        catch (Exception ex)
        {
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = $"An error occurred: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("reset-lesson-time/{id:int}")]
    public async Task<ActionResult<Response>> ResetLessonTimeAsync(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = await trackerService.ResetLessonTimeAsync(HttpContext, id);

            return new ControllerResponse<LessonTrackerResponse>
            {
                Success = true,
                Body = response
            };
            
        }
        catch (Exception ex)
        {
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = $"An error occurred: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("reset-all-time")]
    public async Task<ActionResult<Response>> ResetAllLessonTime()
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = await trackerService.ResetAllAsync(HttpContext);

            return new ControllerResponse<LessonTrackerResponse>
            {
                Success = true,
                Body = response
            };
            
        }
        catch (Exception ex)
        {
            return new ControllerResponse<bool>
            {
                Success = false,
                Error = $"An error occurred: {ex.Message}"
            };
        }
    }
}
