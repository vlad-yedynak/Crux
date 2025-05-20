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
    public Response UpdateLessonTime([FromBody] LessonTrackerRequest request)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = trackerService.UpdateLessonTime(HttpContext, request);

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
    public Response ResetLessonTime(int id)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = trackerService.ResetLessonTime(HttpContext, id);

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
    public Response ResetAllLessonTime()
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<bool>
                {
                    Success = false,
                    Error = "Failed authenticate user."
                };
            }
            
            var response = trackerService.ResetAll(HttpContext);

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
