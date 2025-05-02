using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("lessons")]
public class LessonsController (
    IAuthenticationService authenticationService,
    ILessonService lessonService) : ControllerBase
{
    [HttpPost("create-lesson")]
    public Response CreateLesson([FromBody] string title)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = lessonService.AddLesson(HttpContext, title);

            return new ControllerResponse<LessonResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpPost("create-card")]
    public Response CreateCard([FromBody] CardRequest cardRequest)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = lessonService.AddCard(HttpContext, cardRequest);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }

    [HttpPost("create-question")]
    public Response CreateQuestion([FromBody] QuestionRequest questionRequest)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = lessonService.AddQuestion(HttpContext, questionRequest);

            return new ControllerResponse<QuestionResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<QuestionResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPost("create-task")]
    public Response CreateTask([FromBody] TaskRequest taskRequest)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = lessonService.AddTask(HttpContext, taskRequest);

            return new ControllerResponse<TaskResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<TaskResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpGet("get-lessons")]
    public Response GetLessons()
    {
        try
        {
            var lessons = lessonService.GetLessons(HttpContext);

            return new ControllerResponse<ICollection<LessonResponse>>
            {
                Success = true,
                Body = lessons
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpGet("get-card/{id:int}")]
    public Response GetCard(int id)
    {
        try
        {
            if (!authenticationService.CheckAuthentication(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var card = lessonService.GetCardFull(HttpContext, id);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = card
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
}
