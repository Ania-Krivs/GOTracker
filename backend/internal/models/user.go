package models

type User struct {
	ID string `gorm:"primaryKey;column:id"`
	Name string `gorm:"column:name"`
	Code uint `gorm:"column:code;unique"`

	AdminID   *uint     `gorm:"column:admin_id" json:"admin_id"`
}

func(User) TableName() string{
	return "users"
}
