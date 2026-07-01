package schemas

type CreateUser struct {
	Admin_id	uint  `json:"admin_id" validate:"required"`
	Name		string  `json:"name" validate:"required"`
}