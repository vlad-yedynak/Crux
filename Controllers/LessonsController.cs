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
    
    [HttpPut("update-lesson")]
    public Response UpdateLesson([FromBody] UpdateLessonRequest request)
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
            
            var response = lessonService.UpdateLessonName(HttpContext, request);

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
    
    [HttpDelete("delete-lesson")]
    public Response UpdateLesson([FromBody] int id)
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
            
            var response = lessonService.DeleteLesson(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
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
    
    [HttpPut("update-card")]
    public Response UpdateCard([FromBody] CardRequest request)
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
            
            var response = lessonService.UpdateCard(HttpContext, request);

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
    
    [HttpDelete("delete-card")]
    public Response DeleteCard([FromBody] int id)
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
            
            var response = lessonService.DeleteCard(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
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
    
    [HttpPut("update-question")]
    public Response UpdateQuestion([FromBody] QuestionRequest request)
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
            
            var response = lessonService.UpdateQuestion(HttpContext, request);

            return new ControllerResponse<QuestionResponse>
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
    
    [HttpDelete("delete-question")]
    public Response DeleteQuestion([FromBody] int id)
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
            
            var response = lessonService.DeleteQuestion(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
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
    
    [HttpPut("update-task")]
    public Response UpdateTask([FromBody] TaskRequest request)
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
            
            var response = lessonService.UpdateTask(HttpContext, request);

            return new ControllerResponse<TaskResponse>
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
    
    [HttpDelete("delete-task")]
    public Response DeleteTask([FromBody] int id)
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
            
            var response = lessonService.DeleteTask(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
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
    
    [HttpPost("add-educational-data")]
    public Response AddEducationalData([FromBody] EducationalCardDataRequest educationalCardDataRequest)
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

            var response = lessonService.AddEducationalData(HttpContext, educationalCardDataRequest);

            return new ControllerResponse<EducationalDataResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<EducationalDataResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-educational-data")]
    public Response UpdateEducationalData([FromBody] EducationalCardDataRequest request)
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
            
            var response = lessonService.UpdateEducationalData(HttpContext, request);

            return new ControllerResponse<EducationalDataResponse>
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
