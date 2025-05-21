using Crux.Models.Requests;
using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("testing")]
public class TestingController(
    IAuthenticationService authenticationService,
    ITestService testService) : ControllerBase
{
    [HttpPost("validate-question")]
    public async Task<ActionResult<Response>> ValidateQuestionAsync([FromBody] ValidateQuestionRequest request)
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
            
            bool isCorrect = await testService.ValidateQuestionAsync(HttpContext, request.QuestionId , request.AnswerId);

            return new ControllerResponse<bool>
            {
                Success = true,
                Body = isCorrect
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

    [HttpPost("validate-task")]
    public async Task<ActionResult<Response>> ValidateTaskAsync([FromBody] ValidateTaskRequest request)
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
            
            bool isCorrect = await testService.ValidateTaskAsync(HttpContext, request.TaskId , request.InputData);

            return new ControllerResponse<bool>
            {
                Success = true,
                Body = isCorrect
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