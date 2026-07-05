package schemas

type CreateUser struct {
	Admin_id	string  `json:"admin_id" validate:"required"`
	Name		string  `json:"name" validate:"required"`
}

type LoginByCode struct {
	Code uint `json:"code" validate:"required"`
}