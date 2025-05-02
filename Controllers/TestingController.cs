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
    public Response ValidateQuestion([FromBody] ValidateQuestionRequest request)
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
            
            bool isCorrect = testService.ValidateQuestion(HttpContext, request.QuestionId , request.AnswerId);

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
    public Response ValidateTask([FromBody] ValidateTaskRequest request)
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
            
            bool isCorrect = testService.ValidateTask(HttpContext, request.TaskId , request.InputData);

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